import connectDB from '@/config/db';
import Chat from '@/models/Chat';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const chatData = {
            name: 'New Chat',
            messages: [],
            userId
        };

        await connectDB();
        const chat = await Chat.create(chatData);
        if (chat) {
            return NextResponse.json({ success: true, message: 'Chat created' });
        } else {
            return NextResponse.json({ success: false, error: 'Failed to create chat' }, { status: 500 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}