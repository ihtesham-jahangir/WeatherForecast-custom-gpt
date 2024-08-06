import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Chat() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false); // Track if content is being generated

  // Add initial message when component mounts
  useEffect(() => {
    setMessages([{ text: 'How may I assist you?', sender: 'bot' }]);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    if (isGenerating) {
      handleStop(); // Stop the current generation process if active
    }

    setLoading(true);
    setError(null);
    setIsGenerating(true);

    // Add user's prompt to chat history
    setMessages([...messages, { text: prompt, sender: 'user' }]);
    setPrompt(''); // Clear the input field

    try {
      const res = await axios.post('/api/gpt', { prompt });
      const response = res.data.text;
      let index = 0;

      // Add a placeholder message for the bot's response
      setMessages(prevMessages => [
        ...prevMessages,
        { text: '', sender: 'bot' }
      ]);

      // Update the latest bot message with token-by-token text
      const id = setInterval(() => {
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            text: response.slice(0, index + 1),
          };
          return updatedMessages;
        });
        index++;
        if (index >= response.length) {
          clearInterval(id);
          setIntervalId(null);
          setIsGenerating(false);
        }
      }, 30); // Adjust the typing speed by changing the interval
      setIntervalId(id);

    } catch (err) {
      setError('An error occurred while generating content.');
      setIsGenerating(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          text: lastMessage.text + ' (Stopped)'
        };
        return updatedMessages;
      });
      setIntervalId(null);
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([{ text: 'How may I assist you?', sender: 'bot' }]);
  };

  return (
    <div className="flex flex-col h-screen justify-center items-center p-4 bg-gray-100">
      <header className="w-full max-w-md mb-4">
        <h1 className="text-2xl font-bold text-center">WeatherGPT</h1>
        <h2 className="text-xl text-center text-gray-700">Your Weather and GPT Assistant</h2>
      </header>
      <div className="w-full max-w-md h-[70vh] overflow-y-auto bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded-lg ${
              message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'
            }`}
          >
            {message.text}
          </div>
        ))}
        {loading && (
          <div className="p-2 rounded-lg bg-gray-200 text-gray-900">
            Generating response...
          </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
      </div>
      <form onSubmit={handleSubmit} className="flex mt-4 w-full max-w-md space-x-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here"
          className="flex-1 p-2 border border-gray-300 rounded-lg resize-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
        {isGenerating && (
          <button
            type="button"
            onClick={handleStop}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Stop
          </button>
        )}
        <button
          type="button"
          onClick={handleClear}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          Clear Chat
        </button>
      </form>
    </div>
  );
}
