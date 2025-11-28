export const maxDuration = 60;

import { getAuth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Chat from "@/models/Chat";

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);

export async function POST(req) {
  try {
    console.log("✅ HIT /api/chat/ai");

    const { userId } = getAuth(req);
    console.log("✅ userId:", userId);

    const body = await req.json();
    console.log("✅ BODY:", body);

    const { prompt, chatId } = body;

    if (!process.env.AI_API_KEY) {
      console.error("❌ MISSING AI_API_KEY");
      return NextResponse.json(
        { success: false, error: "AI API key missing" },
        { status: 500 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!prompt || !chatId) {
      return NextResponse.json(
        { success: false, error: "Prompt and Chat ID required" },
        { status: 400 }
      );
    }

    await connectDB();
    console.log("✅ DB connected");

    const chat = await Chat.findOne({ userId, _id: chatId });
    console.log("✅ Chat found:", !!chat);

    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found" },
        { status: 404 }
      );
    }

    if (!Array.isArray(chat.messages)) {
      console.error("❌ messages is NOT an array");
      return NextResponse.json(
        { success: false, error: "Messages array broken" },
        { status: 500 }
      );
    }

    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    });

    console.log("✅ Calling Gemini…");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);
    const response = result?.response?.text?.();

    console.log("✅ Gemini response received");

    if (!response) {
      throw new Error("Gemini returned empty response");
    }

    const assistantMessage = {
      role: "assistant",
      content: response,
      timestamp: Date.now(),
    };

    chat.messages.push(assistantMessage);
    await chat.save();

    console.log("✅ Chat saved");

    return NextResponse.json({
      success: true,
      data: assistantMessage,
    });

  } catch (error) {
    console.error("🔥 AI CHAT CRASH:", error);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
