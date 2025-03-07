import streamlit as st
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from agent.manager_agent import ManagerAgent
load_dotenv()
st.title("Agent UI")

if "messages" not in st.session_state:
    st.session_state.messages = []
    
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
model = ChatOpenAI(model="gpt-4o-mini")
manager = ManagerAgent(model, [])   
if prompt := st.chat_input("What is up?"):
    with st.chat_message("user"):
        st.markdown(prompt)
    
    st.session_state.messages.append({"role": "user", "content": prompt})
    for e in manager.graph.stream({"messages": message}):
        for v in e.values():
            messages = v["messagse"]
            for message in messages:
                with st.chat_message("assistant"):
                    st.markdown(message.content)
                    st.session_state.messages.append({"role": "assistant", "content": message.content})
        