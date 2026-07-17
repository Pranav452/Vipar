"use client"

import { useActionState, useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { login, requestIpAccess, type IpRequestState, type LoginState } from "./actions"

export function LoginForm({ from }: { from?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})
  const [reqState, reqAction, reqPending] = useActionState<IpRequestState, FormData>(requestIpAccess, {})
  const [userValue, setUserValue] = useState("")

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        {from && <input type="hidden" name="from" value={from} />}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="user" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Login ID
          </label>
          <Input
            id="user"
            name="user"
            value={userValue}
            onChange={(e) => setUserValue(e.target.value)}
            autoComplete="username"
            required
            autoFocus
            placeholder="Login ID"
            className="h-11 rounded-xl border-foreground/10 bg-foreground/[0.03]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11 rounded-xl border-foreground/10 bg-foreground/[0.03]"
          />
        </div>

        {state.error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-1 h-11 rounded-xl text-sm font-medium">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {state.ipBlocked && !reqState.success && (
        <form action={reqAction} className="flex flex-col gap-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.04] p-4">
          <input type="hidden" name="user" value={userValue} />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your network (<span className="font-mono font-medium text-foreground">{state.blockedIp}</span>) is
            not yet approved. Send a request — an admin can allow it from the admin panel.
          </p>
          <Input
            name="note"
            placeholder="Optional note (office name, location)…"
            className="h-9 rounded-lg border-foreground/10 bg-foreground/[0.03] text-xs"
          />
          <Button
            type="submit"
            disabled={reqPending}
            variant="outline"
            className="h-9 rounded-lg border-emerald-500/40 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            {reqPending ? "Sending…" : "Request access for this network"}
          </Button>
          {reqState.error && <p className="text-xs text-destructive">{reqState.error}</p>}
        </form>
      )}

      {reqState.success && (
        <p className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          Request sent. An admin will review it — try signing in again once your network is approved.
        </p>
      )}
    </div>
  )
}
