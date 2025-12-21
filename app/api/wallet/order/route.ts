import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const amount = Math.max(1, Number(json?.amount || 0));
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
  }
  const instance = new Razorpay({
    key_id: key,
    key_secret: secret,
  });
  const order = await instance.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `medura_wallet_${Date.now()}`,
  });
  return NextResponse.json({ order });
}
