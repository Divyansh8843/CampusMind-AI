from app.rag.rag_chain import get_llm
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel
import json
import os

class InterviewState(BaseModel):
    history: list = []
    current_question: str = ""
    topic: str = "General Engineering"

def conduct_interview(history: list, user_response: str, topic: str = "General Engineering"):
    """
    Conducts a mock interview (technical or Salary Negotiation HR roleplay).
    If user_response is empty, it starts the interview.
    """
    try:
        llm_engine = get_llm()
        if not llm_engine:
             return {"response": "AI Brain is offline. Please start Ollama or provide an OpenAI API Key."}
        conversation = "\n".join([f"{m['role']}: {m['content']}" for m in history[-6:]])
        topic_lower = (topic or "").lower()
        is_salary_mode = "salary" in topic_lower or "negotiation" in topic_lower or "hr roleplay" in topic_lower

        if is_salary_mode:
            template = """
            You are a TOUGH HR representative in a salary negotiation. You are roleplaying with a college graduate/student.
            Current conversation:
            {conversation}
            Candidate's latest response: "{user_response}"

            Your Task:
            1. If start (empty response), say you're HR and ask what salary they're expecting.
            2. Otherwise: Push back slightly (e.g. "Our budget is tight", "What if we offer X?"), then ask one clear follow-up.
            Keep response SHORT (3-4 sentences), conversational, as if speaking. No bullet points.
            HR Response:
            """
        else:
            template = """
            You are a strict, top-tier Senior Technical Interviewer at a FAANG/MNC (like Google, Microsoft, Meta).
            You are interviewing a candidate for the Role/Topic: {topic}.

            Current Conversation Context:
            {conversation}

            User's Latest Response: "{user_response}"

            Your Task:
            1. Make this EXTREMELY realistic and 100% highly relevant to {topic} for FAANG placements.
            2. If start (empty response): Introduce yourself briefly and immediately ask a highly challenging technical, algorithmic, or system-design question related to {topic}. NO basic textbook questions.
            3. If user responded:
               - FIRST: Provide a crisp 1-sentence professional evaluation. Point out missed edge-cases, scaling flaws, or inefficiencies.
               - SECOND: Ask a difficult follow-up question. Introduce a new constraint (e.g., "How would this scale to 10M requests/sec?", "Can we do this in O(1) space?", or advanced domain gotchas).
            4. CRITICAL: Keep your response SHORT (max 3-4 sentences total). Talk like a real human engineer. NO bullet points.

            Interviewer Response:
            """
        
        prompt = PromptTemplate(
            template=template,
            input_variables=["topic", "conversation", "user_response"]
        )
        final_prompt = prompt.format(
            topic=topic,
            conversation=conversation,
            user_response=user_response
        )
        ai_reply = llm_engine.invoke(final_prompt)
        
        # Handle both string and object responses
        if isinstance(ai_reply, str):
            return {"response": ai_reply}
        elif hasattr(ai_reply, 'content'):
            return {"response": ai_reply.content}
        else:
            return {"response": str(ai_reply)}

    except Exception as e:
        return {"response": f"Error in interview agent: {str(e)}"}

def generate_aptitude_test(topic: str):
    """Generates MCQs for a given topic. Uses local Ollama model."""
    try:
        llm_engine = get_llm()
        if not llm_engine:
             return []
        
        template = """
        Generate a strict JSON array of 20 HIGH-DIFFICULTY multiple-choice questions for a FAANG/MNC Placement Aptitude Test.
        CRITICAL: The questions MUST be heavily focused on the specific domain/topic provided: {topic}.
        Include:
        - 15 extremely challenging technical/core-domain questions directly related to {topic} (e.g., system design bottlenecks, advanced memory management, time complexity of complex algorithms, output prediction for tricky code blocks, deep backend/frontend logic depending on the topic).
        - 5 high-level logical reasoning & quantitative questions typical of top-tier FAANG technical screenings.
        
        Target audience: Global computer science students preparing for top 1% FAANG tech placements.
        
        Format Requirement:
        [
            {{
                "id": 1,
                "question": "Question text here?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option A"
            }}
        ]
        
        Do not include markdown code blocks (```json). Just the raw JSON string.
        """
        
        prompt = PromptTemplate(template=template, input_variables=["topic"])
        final_prompt = prompt.format(topic=topic)
        response = llm_engine.invoke(final_prompt)
        
        # Handle response
        if isinstance(response, str):
            content = response.strip().replace("```json", "").replace("```", "")
        elif hasattr(response, 'content'):
            content = response.content.strip().replace("```json", "").replace("```", "")
        else:
            content = str(response).strip().replace("```json", "").replace("```", "")
        
        return json.loads(content)
        
    except Exception as e:
        print(f"Aptitude Gen Error: {e}")
        return []

def _analyze_fillers(user_transcript: str) -> dict:
    """Detect filler words and hesitation (um, uh, ah, like overuse). Real-time data."""
    if not user_transcript:
        return {"filler_count": 0, "fillers": [], "note": ""}
    import re
    text = user_transcript.lower()
    fillers = ["um", "uh", "ah", "er", "like", "you know", "basically", "actually"]
    found = []
    for f in fillers:
        count = len(re.findall(r"\b" + re.escape(f) + r"\b", text))
        if count > 0:
            found.append({"word": f, "count": count})
    total = sum(x["count"] for x in found)
    note = ""
    if total > 5:
        note = "High use of filler words detected. Practice pausing instead of saying 'um' or 'like'."
    elif total > 2:
        note = "Some filler words detected. Consider reducing them in formal interviews."
    return {"filler_count": total, "fillers": found, "note": note}


def generate_interview_feedback(history: list, topic: str, user_transcript: str = ""):
    """Generates feedback. Optionally includes filler/hesitation analysis from user transcript."""
    try:
        llm_engine = get_llm()
        if not llm_engine:
             return {"score": 0, "feedback": "AI Brain Offline", "strengths": [], "improvements": []}

        conversation = "\n".join([f"{m['role']}: {m['content']}" for m in history])
        voice_analysis = _analyze_fillers(user_transcript) if user_transcript else {}
        
        template = """
        Analyze this mock interview transcript on the topic: {topic}.
        Provide constructive feedback, a score, and actionable advice.
        {voice_note}
        Transcript:
        {conversation}

        Output valid JSON format:
        {{
            "score": 85,
            "feedback": "Overall summary...",
            "strengths": ["Point 1", "Point 2"],
            "improvements": ["Advise 1", "Advise 2"]
        }}
        Do not include markdown code blocks. Just the raw JSON.
        """
        voice_note = ""
        if voice_analysis.get("filler_count", 0) > 0:
            voice_note = f"\nVoice analysis: Candidate used filler words {voice_analysis.get('filler_count')} times. {voice_analysis.get('note', '')} Include one improvement about reducing fillers.\n"
        prompt = PromptTemplate(template=template, input_variables=["topic", "conversation", "voice_note"])
        final_prompt = prompt.format(topic=topic, conversation=conversation, voice_note=voice_note)
        response = llm_engine.invoke(final_prompt)
        
        if isinstance(response, str):
            content = response.strip().replace("```json", "").replace("```", "")
        elif hasattr(response, 'content'):
            content = response.content.strip().replace("```json", "").replace("```", "")
        else:
            content = str(response).strip().replace("```json", "").replace("```", "")
        
        out = json.loads(content)
        if voice_analysis:
            out["voice_analysis"] = voice_analysis
        return out
        
    except Exception as e:
        print(f"Feedback Gen Error: {e}")
        return {
            "score": 0,
            "feedback": "Could not generate feedback.",
            "strengths": [],
            "improvements": [],
            "voice_analysis": _analyze_fillers(user_transcript) if user_transcript else {}
        }
