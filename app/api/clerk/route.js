import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import connectDB from "../../../config/db.js";
import User from "../../../models/User.js";

export async function POST(req) {
    try {
        // Get webhook secret
        const webhookSecret = process.env.SIGNING_SECRET;

        if (!webhookSecret) {
            console.error("Missing SIGNING_SECRET environment variable");
            return NextResponse.json(
                { error: "Webhook secret not configured" },
                { status: 500 }
            );
        }

        // Get headers
        const headerPayload = await headers();
        const svixId = headerPayload.get("svix-id");
        const svixTimestamp = headerPayload.get("svix-timestamp");
        const svixSignature = headerPayload.get("svix-signature");

        // Check if headers exist
        if (!svixId || !svixTimestamp || !svixSignature) {
            console.error("Missing svix headers");
            return NextResponse.json(
                { error: "Missing svix headers" },
                { status: 400 }
            );
        }

        // Get the body
        const payload = await req.json();
        const body = JSON.stringify(payload);

        // Create svix instance and verify webhook
        const wh = new Webhook(webhookSecret);
        let evt;

        try {
            evt = wh.verify(body, {
                "svix-id": svixId,
                "svix-timestamp": svixTimestamp,
                "svix-signature": svixSignature,
            });
        } catch (err) {
            console.error("Webhook verification failed:", err);
            return NextResponse.json(
                { error: "Webhook verification failed" },
                { status: 400 }
            );
        }

        // Extract data from verified event
        const { data, type } = evt;

        console.log(`Webhook received: ${type}`);
        console.log("User data:", data);

        // Connect to database
        await connectDB();

        // Prepare user data
        const userData = {
            _id: data.id,
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            email: data.email_addresses?.[0]?.email_address || "",
            image: data.image_url,
        };

        // Handle different event types
        switch (type) {
            case "user.created":
                console.log("Creating new user:", userData);
                const newUser = await User.create(userData);
                console.log("User created successfully:", newUser._id);
                break;

            case "user.updated":
                console.log("Updating user:", data.id);
                const updatedUser = await User.findByIdAndUpdate(
                    data.id,
                    userData,
                    { new: true, upsert: true }
                );
                console.log("User updated successfully:", updatedUser?._id);
                break;

            case "user.deleted":
                console.log("Deleting user:", data.id);
                await User.findByIdAndDelete(data.id);
                console.log("User deleted successfully");
                break;

            default:
                console.log(`Unhandled event type: ${type}`);
                break;
        }

        return NextResponse.json(
            { message: "Webhook processed successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Webhook handler error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}