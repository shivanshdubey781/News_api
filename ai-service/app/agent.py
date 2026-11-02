"""
agent.py — LangGraph ReAct agent for the /ask endpoint.

Uses LangGraph's prebuilt create_react_agent (replaces the deprecated AgentExecutor).
Tools are wired in as standard LangChain tools; the retriever is also a tool.
The grounding system prompt is always injected — no user prompt can override it.
"""

from __future__ import annotations

import logging
from typing import Any, AsyncIterator, Dict, List

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool

from app.llm import TaskType, get_llm
from app.prompts import ASK_PROMPT
from app.rag.retriever import docs_to_citations, format_context, retrieve
from app.schemas import AskResponse, Citation

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tool definitions (LangChain @tool decorators)
# ---------------------------------------------------------------------------

def _make_retriever_tool(investigation_id: str):
    @tool
    def retrieve_news(query: str) -> str:
        """
        Search the news knowledge base for articles relevant to the query.
        Always use this tool before answering any question about news events.
        Returns formatted article chunks with source metadata.
        """
        docs = retrieve(query, investigation_id=investigation_id, k=8)
        return format_context(docs)

    return retrieve_news


def _make_factcheck_tool():
    @tool
    async def search_fact_checks(claim: str) -> str:
        """
        Search the Google Fact Check database for existing fact-checks of a claim.
        Returns JSON-like text of fact-check hits.
        """
        from app.tools.factcheck import search_factcheck

        hits = await search_factcheck(claim, limit=5)
        if not hits:
            return "No fact-check hits found in the database."
        lines = []
        for h in hits:
            lines.append(
                f"- [{h.get('publisher', 'unknown')}] {h.get('title', '')} "
                f"Rating: {h.get('rating', '?')} | URL: {h.get('url', '')}"
            )
        return "\n".join(lines)

    return search_fact_checks


def _make_wayback_tool():
    @tool
    async def check_wayback_archive(url: str) -> str:
        """
        Check if a URL is archived in the Wayback Machine.
        Useful for verifying publication dates and finding deleted content.
        """
        from app.tools.wayback import check_wayback

        result = await check_wayback(url)
        if result.get("available"):
            return (
                f"Archived: YES\n"
                f"Snapshot URL: {result['snapshot_url']}\n"
                f"Timestamp: {result['timestamp']}"
            )
        return "Not found in Wayback Machine archive."

    return check_wayback_archive


# ---------------------------------------------------------------------------
# Agent builder
# ---------------------------------------------------------------------------

def build_agent(investigation_id: str):
    """
    Build and return a LangGraph ReAct agent compiled graph.
    The agent is scoped to the given investigation.
    """
    from langgraph.prebuilt import create_react_agent

    tools = [
        _make_retriever_tool(investigation_id),
        _make_factcheck_tool(),
        _make_wayback_tool(),
    ]

    llm = get_llm(TaskType.ASK, temperature=0.1)

    agent = create_react_agent(
        model=llm,
        tools=tools,
        state_modifier=ASK_PROMPT,  # Injects grounding system prompt
    )
    return agent


# ---------------------------------------------------------------------------
# Invoke helpers
# ---------------------------------------------------------------------------

async def run_agent(investigation_id: str, question: str) -> AskResponse:
    """Run the agent synchronously and return a structured AskResponse."""
    agent = build_agent(investigation_id)

    result = await agent.ainvoke(
        {"messages": [HumanMessage(content=question)]}
    )

    # Extract final answer from the last AI message
    messages = result.get("messages", [])
    answer = ""
    for msg in reversed(messages):
        if hasattr(msg, "content") and msg.content and not getattr(msg, "tool_calls", None):
            answer = msg.content
            break

    # Pull citations from any retrieval done during the run
    docs = retrieve(question, investigation_id=investigation_id, k=5)
    citations = docs_to_citations(docs)

    return AskResponse(answer=answer, citations=citations)


async def stream_agent(
    investigation_id: str, question: str
) -> AsyncIterator[str]:
    """
    Stream the agent's token output for SSE delivery.
    Yields text chunks.
    """
    agent = build_agent(investigation_id)

    async for event in agent.astream_events(
        {"messages": [HumanMessage(content=question)]},
        version="v2",
    ):
        kind = event.get("event", "")
        # Stream only text chunks from AI responses (not tool calls)
        if kind == "on_chat_model_stream":
            chunk = event.get("data", {}).get("chunk", None)
            if chunk and hasattr(chunk, "content") and chunk.content:
                yield chunk.content

