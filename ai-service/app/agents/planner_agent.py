from app.rag.rag_chain import get_llm
from langchain_core.prompts import PromptTemplate
import json

def generate_study_plan(state: dict):
    """
    Generates a study schedule based on the provided topics or syllabus.
    """
    try:
        topic_or_syllabus = state.get("query", "")
        llm_engine = get_llm()

        if not llm_engine:
             return {"response": "AI Brain is offline. Please start Ollama or provide an OpenAI API Key."}
        template = """
        You are an intelligent AI Study Planner.
        Your goal is to create a structured study schedule based on the student's syllabus or topics.
        
        Syllabus / Topics Provided:
        {topics}
        
        Instructions:
        1. Break down the topics into manageable daily or weekly modules.
        2. Assign estimated time for each topic based on difficulty (assume standard difficulty if not specified).
        3. Include breaks and review sessions.
        4. Output the schedule in a clear, readable format (Markdown).
        
        Study Schedule:
        """
        
        prompt = PromptTemplate(template=template, input_variables=["topics"])
        final_prompt = prompt.format(topics=topic_or_syllabus)
        response = llm_engine.invoke(final_prompt)
        
        if isinstance(response, str):
            return {"response": response}
        elif hasattr(response, 'content'):
            return {"response": response.content}
        else:
            return {"response": str(response)}

    except Exception as e:
        return {"response": f"Error generating study plan: {str(e)}"}
