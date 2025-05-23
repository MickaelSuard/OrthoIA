import { correctText } from '../services/correctionIA';
import { useTheme } from '../ThemeContext';
import { useState } from 'react';
import Search from '../ui/Search';
import { motion, AnimatePresence } from "framer-motion";
import { Clipboard } from 'lucide-react';

type Chat = {
  id: string;
  title: string;
  feature: string;
  messages: { content: string; isUser: boolean }[];
};

type CorrectionProps = {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChat: string | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<string | null>>;
};

function Correction({ chats, setChats, selectedChat, setSelectedChat }: CorrectionProps) {
  const { classes } = useTheme();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [correctionMode, setCorrectionMode] = useState<'formelle' | 'informelle'>('formelle'); // New state for correction mode

  const handleSubmit = async () => {
    if (!input.trim()) return;

    let activeChat = chats.find(chat => chat.id === selectedChat);

    if (!activeChat) {
      const newChat = {
        id: Date.now().toString(),
        title: `Correction ${chats.length + 1}`,
        feature: 'correct',
        messages: [],
      };
      setChats(prevChats => [newChat, ...prevChats]);
      setSelectedChat(newChat.id);
      activeChat = newChat;
    }

    const userMessage = { content: input, isUser: true };
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === activeChat.id
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
    );
    setInput('');
    setIsLoading(true);
    try {
      const correctedMessage = await correctText(input, correctionMode); // Pass correction mode
      console.log(correctedMessage);

      // Message pour le texte corrigé
      const correctedBotMessage = {
        content: correctedMessage.correctedText,
        isUser: false,
      };

      console.log(correctedMessage.suggestions)
      // Concatenation de toutes les suggestions dans un seul message
      const suggestionsContent = correctedMessage.suggestions?.map((suggestion) => `• ${suggestion}`).join('<br />') || 'Aucune suggestion disponible.';

      // Message pour les suggestions (dans une seule bulle)
      const suggestionsBotMessage = {
        content: suggestionsContent,
        isUser: false,
      };

      // Mise à jour de l'état avec les nouveaux messages
      setChats(prevChats => prevChats.map(chat => chat.id === activeChat.id
        ? { ...chat, messages: [...chat.messages, correctedBotMessage, suggestionsBotMessage] }
        : chat
      ));
    } catch (error) {
      console.error('Erreur lors de la correction:', error);
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === activeChat.id
            ? { ...chat, messages: [...chat.messages, { content: 'Erreur lors de la correction.', isUser: false }] }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
     
    }

  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Texte copié dans le presse-papiers !');
    }).catch(err => {
      console.error('Erreur lors de la copie du texte :', err);
    });
  };

  const activeChat = chats.find(chat => chat.id === selectedChat);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {activeChat ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col h-full"
          >
            <div className=" flex-1 p-6 overflow-y-auto space-y-4 "> 
              {activeChat.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-xl p-4 text-sm ${message.isUser
                      ? `${classes.buttonBackground} shadow-md`
                      : `${classes.inputBackground} ${classes.border} shadow-md`
                      } relative`}
                  >
                    {!message.isUser && (
                      <div className="flex items-center">
                        <div className="flex-1" dangerouslySetInnerHTML={{ __html: message.content }} />
                        <button
                          onClick={() => handleCopy(message.content)}
                          className={`ml-2 p-1 text-gray-500 hover:text-gray-700 ${classes.text} rounded-full shadow-sm`}
                        >
                          <Clipboard size={16} />
                        </button>
                      </div>
                    )}
                    {message.isUser && (
                      message.content
                    )}
                  </div>
                </div>
              ))}

              {/* Affichage du loader si isLoading est true */}
              {isLoading && (
                <div className="flex justify-center items-center">
                  <div className="w-6 h-6 border-4 border-t-4 border-gray-500 border-solid rounded-full animate-spin"></div>
                  <span className="text-gray-500 ml-2">Chargement...</span>
                </div>
              )}
            </div>

            {/* Barre de recherche */}
            <div className="sticky bottom-0 flex flex-col gap-2 p-4">
              {/* Dropdown for correction mode */}
              <div className="self-start">
                <label htmlFor="correctionMode" className={`block text-sm font-medium ${classes.text}`}>
                  Mode de correction :
                </label>
                <select
                  id="correctionMode"
                  value={correctionMode}
                  onChange={(e) => setCorrectionMode(e.target.value as 'formelle' | 'informelle')}
                  className={`mt-1 p-2 rounded-xl border ${classes.inputBackground} ${classes.inputBorder} ${classes.text}`}
                >
                  <option value="formelle">Formelle</option>
                  <option value="informelle">Informelle</option>
                </select>
              </div>
              <Search
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSubmit={handleSubmit}
                placeholder="Écrivez votre message ici..."
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="search"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-1 items-center justify-center"
          >
            <div className="w-full flex flex-col justify-center items-center">
              <h2 className={`text-3xl font-semibold ${classes.text} mb-4`}>
                Quelle correction souhaitez-vous que je réalise ?
              </h2>
              {/* Dropdown for correction mode */}
              <div className="mb-4 w-full max-w-md">
                <label htmlFor="correctionMode" className={`block text-sm font-medium ${classes.text}`}>
                  Mode de correction :
                </label>
                <select
                  id="correctionMode"
                  value={correctionMode}
                  onChange={(e) => setCorrectionMode(e.target.value as 'formelle' | 'informelle')}
                  className={`mt-1 block w-full p-2 rounded-xl border ${classes.inputBackground} ${classes.inputBorder} ${classes.text}`}
                >
                  <option value="formelle">Formelle</option>
                  <option value="informelle">Informelle</option>
                </select>
              </div>
              <Search
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSubmit={handleSubmit}
                placeholder="Écrivez votre message ici..."
                isLoading={isLoading}
              />
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
}

export default Correction;
