import streamlit as st
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from agent.manager_agent import ManagerAgent
from langchain_core.messages import HumanMessage, AIMessage
load_dotenv()
st.title("Agent UI")
print("Xin chao")
if "messages" not in st.session_state:
    st.session_state.messages = []
    
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
model = ChatOpenAI(model="gpt-4o-mini")
dialog_id = "a5b0420aae4f11efa76e0242ac140008"
manager = ManagerAgent(model, [], dialog_id)   
if prompt := st.chat_input("What is up?"):
    with st.chat_message("user"):
        st.markdown(prompt)
    
    # messages = []
    # for message in st.session_state.messages:
    #     if message["role"] == "user":
    #         messages.append(HumanMessage(content=message["content"]))
    #     elif message["role"] == "assistant":
    #         messages.append(AIMessage(content=message["content"]))
    messages = st.session_state.messages[-6:]
    with st.chat_message("assistant"):
        content = ""
        for e in manager.graph.stream({"history": messages, "query": HumanMessage(content=prompt), "messages": [], "dialog_id": dialog_id}):
            for v in e.values():
                messages = v["messages"]
                for message in messages:
                    if type(message) == AIMessage and message.content.strip() != "":
                        
                        st.markdown(message.content)
                        if content != "":
                            content += "\n"
                        content += message.content
        st.session_state.messages.append({"role": "user", "content": prompt})
        st.session_state.messages.append({"role": "assistant", "content": content})
        
        