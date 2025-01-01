import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const body = await request.json();
    const { apiKey, rateLimit } = body;

    // Validate inputs first
    if (!apiKey || !rateLimit) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let envContent = "";
    try {
      envContent = await fs.readFile(envPath, "utf-8");
    } catch (error) {
      envContent = "";
    }

    // Parse existing env file
    const envLines = envContent.split("\n");
    const newEnv = new Map();

    // Process existing lines
    envLines.forEach((line) => {
      const line_trim = line.trim();
      if (line_trim) {
        const equalIndex = line_trim.indexOf("=");
        if (equalIndex !== -1) {
          const key = line_trim.slice(0, equalIndex);
          const value = line_trim.slice(equalIndex + 1);
          newEnv.set(key, value);
        }
      }
    });

    // Update values
    newEnv.set("NEXT_PUBLIC_API_KEY", apiKey);
    newEnv.set("NEXT_PUBLIC_RATE_LIMIT", rateLimit.toString());

    // Generate new content
    const newContent = Array.from(newEnv.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    await fs.writeFile(envPath, newContent + "\n", "utf-8");

    return NextResponse.json({ apiKey, rateLimit }, { status: 201 });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}
