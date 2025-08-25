const { useState, useEffect, useRef } = React;

// Mock server simulation
class MockSocket {
    constructor() {
        this.listeners = {};
        this.connected = false;
        this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
        this.connect();
    }

    connect() {
        setTimeout(() => {
            this.connected = true;
            this.emit('connect');
            this.simulateOtherUsers();
        }, 1000);
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (event === 'send_message') {
            setTimeout(() => {
                if (this.listeners['message_received']) {
                    this.listeners['message_received'].forEach(cb => cb({
                        id: Date.now(),
                        text: data.text,
                        username: data.username || 'You',
                        timestamp: new Date(),
                        userColor: data.userColor
                    }));
                }
                if (Math.random() > 0.7) {
                    setTimeout(() => {
                        const responses = [
                            "That's interesting!",
                            "I agree with you.",
                            "Tell me more about that.",
                            "Great point!",
                            "I was thinking the same thing.",
                            "Thanks for sharing!",
                            "What do others think about this?"
                        ];
                        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                        if (this.listeners['message_received']) {
                            this.listeners['message_received'].forEach(cb => cb({
                                id: Date.now() + 1,
                                text: randomResponse,
                                username: 'AI Assistant',
                                timestamp: new Date(),
                                userColor: '#8B5CF6'
                            }));
                        }
                    }, 2000 + Math.random() * 3000);
                }
            }, 500 + Math.random() * 1000);
        }
    }

    simulateOtherUsers() {
        const users = [
            { id: 'user_ai', name: 'AI Assistant', color: '#8B5CF6', online: true },
            { id: 'user_john', name: 'John Doe', color: '#3B82F6', online: true },
            { id: 'user_jane', name: 'Jane Smith', color: '#EC4899', online: false }
        ];
        if (this.listeners['users_online']) {
            this.listeners['users_online'].forEach(cb => cb(users));
        }
    }

    disconnect() {
        this.connected = false;
        if (this.listeners['disconnect']) {
            this.listeners['disconnect'].forEach(cb => cb());
        }
    }
}

const ChatApp = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [username, setUsername] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(true);
    const [typingUsers, setTypingUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        socketRef.current = new MockSocket();
        socketRef.current.on('connect', () => setIsConnected(true));
        socketRef.current.on('message_received', (message) => {
            setMessages(prev => [...prev, message]);
        });
        socketRef.current.on('users_online', (users) => setOnlineUsers(users));
        socketRef.current.on('user_typing', (user) => {
            setTypingUsers(prev => {
                if (!prev.find(u => u.id === user.id)) {
                    return [...prev, user];
                }
                return prev;
            });
        });
        socketRef.current.on('user_stop_typing', (userId) => {
            setTypingUsers(prev => prev.filter(u => u.id !== userId));
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const handleSendMessage = () => {
        if (inputMessage.trim() && username) {
            const userColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
            socketRef.current.emit('send_message', {
                text: inputMessage,
                username: username,
                userColor: userColor
            });
            setInputMessage('');
            setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u.id !== 'current_user'));
            }, 1000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        } else {
            if (!typingUsers.find(u => u.id === 'current_user')) {
                setTypingUsers(prev => [...prev, { id: 'current_user', name: username }]);
            }
        }
    };

    const handleUsernameSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) setShowUserModal(false);
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <div className="flex h-screen bg-gray-100">
            {showUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-96">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Welcome to Chat App</h2>
                        <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/471100f7-2018-4903-abc1-949c4a61ef99.png"
                             alt="Chat" className="w-full h-48 object-cover rounded-lg mb-6" />
                        <form onSubmit={handleUsernameSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Enter Your Name</label>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="Your name..." autoFocus />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                                    disabled={!username.trim()}>Join Chat</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-800">Real-Time Chat</h1>
                    <div className="flex items-center mt-2">
                        <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-600">{isConnected ? 'Connected' : 'Connecting...'}</span>
                    </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Online Users ({onlineUsers.length})</h3>
                    <div className="space-y-3">
                        {onlineUsers.map((user) => (
                            <div key={user.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                                         style={{ backgroundColor: user.color }}>
                                        {getInitials(user.name)}
                                    </div>
                                    {user.online && <div className="online-indicator"></div>}
                                </div>
                                <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.online ? 'Online' : 'Offline'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs mr-3"
                             style={{ backgroundColor: '#3B82F6' }}>
                            {username ? getInitials(username) : 'U'}
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-900">{username || 'Guest'}</div>
                            <div className="text-xs text-gray-500">You</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">General Chat</h2>
                            <div className="text-sm text-gray-500">
                                {typingUsers.length > 0 ? (
                                    <span className="flex items-center">
                                        {typingUsers.map((user, index) => (
                                            <span key={user.id} className="mr-1">{user.name}{index < typingUsers.length - 1 ? ', ' : ''}</span>
                                        ))}
                                        {typingUsers.length === 1 ? ' is ' : ' are '}
                                        <span className="typing-indicator ml-1">
                                            <span className="typing-dot"></span>
                                            <span className="typing-dot"></span>
                                            <span className="typing-dot"></span>
                                        </span>
                                    </span>
                                ) : (
                                    `${onlineUsers.filter(u => u.online).length} users online`
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div key={message.id}
                                 className={`chat-message-animation flex ${message.username === 'You' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${message.username === 'You' ? 'ml-auto' : 'mr-auto'}`}>
                                    <div className={`flex ${message.username === 'You' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0"
                                             style={{ backgroundColor: message.userColor }}>
                                            {getInitials(message.username)}
                                        </div>
                                        <div className={`${message.username === 'You' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'} rounded-2xl px-4 py-2 shadow-sm`}>
                                            <p className="text-sm">{message.text}</p>
                                            <p className={`text-xs mt-1 ${message.username === 'You' ? 'text-blue-200' : 'text-gray-500'}`}>
                                                {formatTime(message.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex space-x-3">
                        <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                               onKeyPress={handleKeyPress} placeholder="Type a message..."
                               className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               disabled={!username} />
                        <button onClick={handleSendMessage} disabled={!inputMessage.trim() || !username}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ChatApp />);
