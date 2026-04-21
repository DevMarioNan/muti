import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          await db.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubId: subscription.id,
              stripeSubStatus: subscription.status,
              subscriptionTier: "pro",
            },
          })
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const user = await db.user.findFirst({
          where: { stripeSubId: subscription.id },
        })

        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: {
              stripeSubStatus: subscription.status,
              subscriptionTier: subscription.status === "active" ? "pro" : "free",
            },
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const user = await db.user.findFirst({
          where: { stripeSubId: subscription.id },
        })

        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: {
              stripeSubId: null,
              stripeSubStatus: null,
              subscriptionTier: "free",
            },
          })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id

        if (subscriptionId) {
          const user = await db.user.findFirst({
            where: { stripeSubId: subscriptionId },
          })

          if (user) {
            await db.user.update({
              where: { id: user.id },
              data: {
                stripeSubStatus: "past_due",
              },
            })
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error(`Webhook handler error: ${message}`)
    return NextResponse.json({ error: `Handler error: ${message}` }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
