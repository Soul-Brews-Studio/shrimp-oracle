package hooks

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

// RegisterHooks sets up all custom hooks for Oracle Universe
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
	// ROUTES
	// ============================================================

	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		// Universe info
		e.Router.GET("/api/info", func(re *core.RequestEvent) error {
			return re.JSON(http.StatusOK, map[string]any{
				"name":    "Oracle Universe",
				"version": "1.0.0",
				"realms":  []string{"agents", "humans", "oracles"},
			})
		})

		// Serve SKILL.md for AI agents
		e.Router.GET("/skill.md", func(re *core.RequestEvent) error {
			exe, _ := os.Executable()
			dir := filepath.Dir(exe)
			skillPath := filepath.Join(dir, "SKILL.md")

			if _, err := os.Stat(skillPath); os.IsNotExist(err) {
				skillPath = "SKILL.md"
			}

			content, err := os.ReadFile(skillPath)
			if err != nil {
				return re.String(http.StatusNotFound, "# SKILL.md not found")
			}

			re.Response.Header().Set("Content-Type", "text/markdown; charset=utf-8")
			return re.String(http.StatusOK, string(content))
		})

		// ========== AGENT ENDPOINTS ==========

		// Agent presence
		e.Router.GET("/api/agents/presence", func(re *core.RequestEvent) error {
			records, err := app.FindRecordsByFilter(
				"agent_heartbeats",
				"created > @now - 300",
				"-created",
				100,
				0,
			)
			if err != nil {
				return re.JSON(http.StatusOK, map[string]any{
					"items":       []any{},
					"totalOnline": 0,
				})
			}

			items := make([]map[string]any, 0)
			for _, record := range records {
				items = append(items, map[string]any{
					"id":       record.GetString("agent"),
					"status":   record.GetString("status"),
					"lastSeen": record.GetString("updated"),
				})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"items":       items,
				"totalOnline": len(items),
			})
		})

		// Agent me
		e.Router.GET("/api/agents/me", func(re *core.RequestEvent) error {
			if re.Auth == nil {
				return re.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"id":             re.Auth.Id,
				"wallet_address": re.Auth.GetString("wallet_address"),
				"display_name":   re.Auth.GetString("display_name"),
				"reputation":     re.Auth.GetInt("reputation"),
				"verified":       re.Auth.GetBool("verified"),
			})
		})

		// ========== HUMAN ENDPOINTS ==========

		// Human me
		e.Router.GET("/api/humans/me", func(re *core.RequestEvent) error {
			if re.Auth == nil {
				return re.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"id":              re.Auth.Id,
				"wallet_address":  re.Auth.GetString("wallet_address"),
				"display_name":    re.Auth.GetString("display_name"),
				"github_username": re.Auth.GetString("github_username"),
			})
		})

		// ========== ORACLE ENDPOINTS ==========

		// Oracle presence
		e.Router.GET("/api/oracles/presence", func(re *core.RequestEvent) error {
			records, err := app.FindRecordsByFilter(
				"oracle_heartbeats",
				"created > @now - 300",
				"-created",
				100,
				0,
			)
			if err != nil {
				return re.JSON(http.StatusOK, map[string]any{
					"items":       []any{},
					"totalOnline": 0,
				})
			}

			items := make([]map[string]any, 0)
			for _, record := range records {
				items = append(items, map[string]any{
					"id":       record.GetString("oracle"),
					"status":   record.GetString("status"),
					"lastSeen": record.GetString("updated"),
				})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"items":       items,
				"totalOnline": len(items),
			})
		})

		// Feed endpoint
		e.Router.GET("/api/feed", func(re *core.RequestEvent) error {
			sort := re.Request.URL.Query().Get("sort")
			if sort == "" {
				sort = "hot"
			}

			var orderBy string
			switch sort {
			case "new":
				orderBy = "-created"
			case "top":
				orderBy = "-score"
			default: // hot
				orderBy = "-score,-created"
			}

			records, err := app.FindRecordsByFilter("posts", "", orderBy, 50, 0)
			if err != nil {
				return re.JSON(http.StatusOK, map[string]any{"items": []any{}})
			}

			items := make([]map[string]any, 0)
			for _, record := range records {
				items = append(items, map[string]any{
					"id":        record.Id,
					"title":     record.GetString("title"),
					"content":   record.GetString("content"),
					"author":    record.GetString("author"),
					"score":     record.GetInt("score"),
					"upvotes":   record.GetInt("upvotes"),
					"downvotes": record.GetInt("downvotes"),
					"created":   record.GetString("created"),
				})
			}

			return re.JSON(http.StatusOK, map[string]any{"items": items})
		})

		return e.Next()
	})
}
