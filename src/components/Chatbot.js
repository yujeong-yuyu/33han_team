import { useState, useRef, useEffect } from 'react';
import '../css/Chatbot.css'
import { IoAlertCircle, IoClose } from "react-icons/io5";

const Chatbot = ({ onClose }) => {
    const [messages, setMessages] = useState([]); //페이지 상태관리
    const [inputMessage, setInputMessage] = useState(""); //사용자 입력상태 관리
    const [ChatbotData, setChatbotData] = useState(null); //챗봇 데이터 상태관리 [최종데이터,변경된데이터]
    const messagesEndRef = useRef(null); //메세지 리스트 끝부분 이동하기 위함

    //메세지 리스트를 자동으로 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    //메세지를 응답받으면 화면 맨 아래로 스크롤 이동(scrollToBottom 실행)
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    //fetch API를 사용하여 json 데이터 가져오기
    useEffect(() => {
        const fetchChatbotData = async () => {
            try {
                const response = await fetch("/data/chatbotData.json");
                if (!response.ok) {
                    throw new Error("데이터를 가져오지 못했습니다.")
                } const data = await response.json();
                setChatbotData(data); //가져온데이터 상태 저장

            } catch (error) {
                console.error("Fetch에러:", error);
            }
        };
        fetchChatbotData();
    }, []);

    //메세지 전송 처리
    const handleSendMessage = () => {
        if (inputMessage.trim() && ChatbotData) {
            //사용자 메세지 추가
            const userMessage = { type: "user", text: inputMessage };
            setMessages((prevMessages) => [...prevMessages, userMessage]);

            //키워드 응답 검색
            const response = ChatbotData.responses.find((item) =>
                inputMessage.toLowerCase().trim().includes(item.keyword.toLowerCase().trim())
            );

            //봇 메세지 생성 (데이터에 저장된 메세지 )
            const botMessage = {
                type: "bot",
                text: response ? response.response : ChatbotData.defaultResponse
            };

            // 봇 메세지 추가
            setMessages((prevMessages) => [...prevMessages, botMessage]);
            setInputMessage(""); //입력필드 초기화


        }
    }

    //엔터키로 메세지 전송
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    }

    // ESC 닫기
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);


    return (
        <div className='chatbot-container'>
            <div className='chatbot-title'>
                <sapn>Souvenir Chatbot</sapn>
                <img src='/img/ask_chatbot.png' alt='askicon' width="50" ></img>
            </div>
            <button onClick={onClose}>
                <IoClose className='Chatbot-Close' />
            </button>
            <div className='chat-notice'>
                <div className='chat-noticeicon'><IoAlertCircle /></div>
                <span>배송지연으로 인해 9월 10일부터배송이  시작됩니다.</span>
            </div>

            <div className='message-list'>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={message.type === "user" ? "user-message" : "bot-message"}
                    >
                        {message.text}
                    </div>
                ))}
                <div ref={messagesEndRef}></div>
            </div>

            {/* 메세지 입력 필드 */}
            <div className='input-container'>
                <input
                    type='text'
                    placeholder='메세지를 입력하세요'
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button onClick={handleSendMessage}>
                    <img src='/img/a_event_wh_logo.png' width={15} alt='wh_logo'></img>
                </button>
            </div>
        </div>
    )
}

export default Chatbot;