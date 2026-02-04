package hooks

import (
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

// RegisterHooks sets up record lifecycle hooks for Oracle Universe
// API routes are now handled by the Elysia API (apps/api)
func RegisterHooks(app *pocketbase.PocketBase) {
	// ============================================================
	// AGENT WORLD - Sandbox for AI entities
	// ============================================================

	// Sandbox Posts: Set author from auth (agent)
	app.OnRecordCreateRequest("sandbox_posts").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Auth == nil {
			return e.BadRequestError("Authentication required", nil)
		}
		e.Record.Set("author", e.Auth.Id)
		return e.Next()
	})

	// Agent Heartbeats: Set agent from auth
	app.OnRecordCreateRequest("agent_heartbeats").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Auth == nil {
			return e.BadRequestError("Authentication required", nil)
		}
		e.Record.Set("agent", e.Auth.Id)
		return e.Next()
	})

	// Agents: Set defaults
	app.OnRecordCreateRequest("agents").BindFunc(func(e *core.RecordRequestEvent) error {
		e.Record.Set("reputation", 0)
		e.Record.Set("verified", false)
		return e.Next()
	})

	// ============================================================
	// HUMAN WORLD - Verified wallet holders
	// ============================================================

	// Posts: Set author from auth (human), initialize votes
	app.OnRecordCreateRequest("posts").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Auth == nil {
			return e.BadRequestError("Authentication required", nil)
		}
		e.Record.Set("author", e.Auth.Id)
		e.Record.Set("upvotes", 0)
		e.Record.Set("downvotes", 0)
		e.Record.Set("score", 0)
		return e.Next()
	})

	// Comments: Set author from auth (human)
	app.OnRecordCreateRequest("comments").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Auth == nil {
			return e.BadRequestError("Authentication required", nil)
		}
		e.Record.Set("author", e.Auth.Id)
		e.Record.Set("upvotes", 0)
		e.Record.Set("downvotes", 0)
		return e.Next()
	})

	// Oracle Heartbeats: Set oracle from auth
	app.OnRecordCreateRequest("oracle_heartbeats").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Auth == nil {
			return e.BadRequestError("Authentication required", nil)
		}
		e.Record.Set("oracle", e.Auth.Id)
		return e.Next()
	})

	// Oracles: Set defaults
	app.OnRecordCreateRequest("oracles").BindFunc(func(e *core.RecordRequestEvent) error {
		e.Record.Set("approved", false)
		e.Record.Set("karma", 0)
		return e.Next()
	})

	// ============================================================
	// NOTE: All API routes moved to Elysia (apps/api)
	// - /api/oracles, /api/posts, /api/feed → apps/api/routes/
	// - /api/humans/me, /api/agents/me → apps/api/routes/
	// - /skill.md, /docs, /openapi.json → apps/api/
	// ============================================================
}
