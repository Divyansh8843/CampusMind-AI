from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel
import json
import os

class InterviewState(BaseModel):
    history: list = []
    current_question: str = ""
    topic: str = "General Engineering"

# Use Ollama for local LLM (no API key required)
llm = OllamaLLM(model="llama2", temperature=0.7)

def conduct_interview(history: list, user_response: str, topic: str = "General Engineering"):
    """
    Conducts a mock interview.
    If user_response is empty, it starts the interview.
    Otherwise, it evaluates the answer and asks the next question.
    Uses local Ollama model - no external API keys required.
    """
    try:
        
        # Convert history for context
        conversation = "\n".join([f"{m['role']}: {m['content']}" for m in history[-6:]]) # Keep last 3 turns
        
        template = """
        You are an experienced Technical Interviewer for a top tech company.
        You are conducting a VOICE-BASED mock interview with a college student on the Role/Topic: {topic}.

        Current Conversation Context:
        {conversation}

        User's Latest Response: "{user_response}"

        Your Task:
        1. If this is the start (empty response), introduce yourself briefly and ask the first key technical question for this role.
        2. If the user responded:
           - FIRST: Provide a crisp 1-sentence evaluation or suggestion on their answer (e.g., "Good mention of X, but also consider Y").
           - SECOND: Ask exactly ONE follow-up or new question.
        3. CRITICAL: Keep your response SHORT (max 3-4 sentences total) and conversational. Do not use bullet points. Write as if you are speaking.

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
        ai_reply = llm.invoke(final_prompt)
        
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
        
        template = """
        Generate a strict JSON array of 20 multiple-choice questions (MCQs) for a Placement Aptitude Test.
        Include Quantitative Aptitude, Logical Reasoning, and Verbal Ability questions.
        If a specific technical topic is provided ({topic}), include 5-6 technical questions related to it as well.
        Target audience: College students preparing for placements.
        
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
        response = llm.invoke(final_prompt)
        
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

def generate_interview_feedback(history: list, topic: str):
    """Generates detailed feedback based on interview history. Uses local Ollama model."""
    try:
        
        conversation = "\n".join([f"{m['role']}: {m['content']}" for m in history])
        
        template = """
        Analyze this mock interview transcript on the topic: {topic}.
        Provide constructive feedback, a score, and actionable advice.
        
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
        
        prompt = PromptTemplate(template=template, input_variables=["topic", "conversation"])
        final_prompt = prompt.format(topic=topic, conversation=conversation)
        response = llm.invoke(final_prompt)
        
        # Handle response
        if isinstance(response, str):
            content = response.strip().replace("```json", "").replace("```", "")
        elif hasattr(response, 'content'):
            content = response.content.strip().replace("```json", "").replace("```", "")
        else:
            content = str(response).strip().replace("```json", "").replace("```", "")
        
        return json.loads(content)
        
    except Exception as e:
        print(f"Feedback Gen Error: {e}")
        return {
            "score": 0,
            "feedback": "Could not generate feedback.",
            "strengths": [],
            "improvements": []
        }
