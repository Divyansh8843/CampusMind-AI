from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate
import json

# Use Ollama for local LLM
llm = OllamaLLM(model="llama2", temperature=0.7)

def generate_study_plan(topic_or_syllabus: str):
    """
    Generates a study schedule based on the provided topics or syllabus.
    """
    try:
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
        response = llm.invoke(final_prompt)
        
        if isinstance(response, str):
            return {"response": response}
        elif hasattr(response, 'content'):
            return {"response": response.content}
        else:
            return {"response": str(response)}

    except Exception as e:
        return {"response": f"Error generating study plan: {str(e)}"}
