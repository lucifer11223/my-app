"use client"
import axios from "axios"
import { useAuth, useUser } from "@clerk/nextjs"
import { createContext, useContext, useEffect, useState } from "react"
import toast from "react-hot-toast"

export const AppContext = createContext()

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = ({ children }) => {


    const { user } = useUser();
    const { getToken } = useAuth();

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);

    const createNewChat = async () => {
        try {
            if (!user) return null;
            const token = await getToken();
            await axios.post("/api/chat/create",{}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            fetchUsersChats();

        } catch (error) {
            toast.error(error?.message);
        }
    }

    const fetchUsersChats = async () => {
        try {
            if (!user) return

            const token = await getToken()

            const { data } = await axios.get("/api/chat/get", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            // ✅ FULL SAFETY CHECK
            if (!data || !data.success || !Array.isArray(data.data)) {
                console.error("Invalid chat response:", data)
                setChats([])
                setSelectedChat(null)
                return
            }

            const sortedChats = [...data.data].sort(
                (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
            )

            // ✅ No chats → create once
            if (sortedChats.length === 0) {
                await createNewChat()
                return fetchUsersChats()
            }

            setChats(sortedChats)
            setSelectedChat(sortedChats[0])

        } catch (error) {
            console.error("FETCH CHAT ERROR:", error)
            toast.error(error?.response?.data?.error || error.message)

            // ✅ prevent iterable crash
            setChats([])
            setSelectedChat(null)
        }
    }


    useEffect(() => {
        if (user) {
            fetchUsersChats();
        }
    }, [user])

    const value = {
        user, chats, selectedChat, setSelectedChat, setChats, fetchUsersChats,
        createNewChat
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}
