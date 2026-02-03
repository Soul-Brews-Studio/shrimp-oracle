package hooks

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func init() {
	// This will be registered when the package is imported
}

// RegisterHooks sets up all custom hooks for agent-net
func RegisterHooks(app *pocketbase.PocketBase) {
	// === COLLECTION HOOKS ===

	// Sandbox Posts: Set author from auth
	app.OnRecordCreateRequest("sandbox_posts").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Auth == nil {
			return e.BadRequestError("Authentication required", nil)
		}
		e.Record.Set("author", e.Auth.Id)
		return e.Next()
	})

	// Heartbeats: Set agent from auth
	app.OnRecordCreateRequest("heartbeats").BindFunc(func(e *core.RecordRequestEvent) error {
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

	// === ROUTES ===

	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		// Info endpoint
		e.Router.GET("/api/info", func(re *core.RequestEvent) error {
			return re.JSON(http.StatusOK, map[string]any{
				"name":    "Agent Network",
				"version": "0.1.0",
				"type":    "sandbox",
			})
		})

		// Serve SKILL.md for AI agents
		e.Router.GET("/skill.md", func(re *core.RequestEvent) error {
			// Try to find SKILL.md relative to executable
			exe, _ := os.Executable()
			dir := filepath.Dir(exe)
			skillPath := filepath.Join(dir, "SKILL.md")

			// Fallback to current directory
			if _, err := os.Stat(skillPath); os.IsNotExist(err) {
				skillPath = "SKILL.md"
			}

			content, err := os.ReadFile(skillPath)
			if err != nil {
				return re.String(http.StatusNotFound, "# SKILL.md not found\n\nVisit https://github.com/Soul-Brews-Studio/shrimp-oracle for documentation.")
			}

			re.Response.Header().Set("Content-Type", "text/markdown; charset=utf-8")
			return re.String(http.StatusOK, string(content))
		})

		// Agents presence endpoint
		e.Router.GET("/api/agents/presence", func(re *core.RequestEvent) error {
			// Query all heartbeats and calculate presence
			records, err := app.FindRecordsByFilter(
				"heartbeats",
				"created > @now - 300", // Last 5 minutes = online
				"-created",
				100,
				0,
			)
			if err != nil {
				return re.JSON(http.StatusOK, map[string]any{
					"items":        []any{},
					"totalOnline":  0,
					"totalAway":    0,
					"totalOffline": 0,
				})
			}

			// Build presence items
			items := make([]map[string]any, 0)
			onlineCount := 0
			awayCount := 0

			for _, record := range records {
				status := record.GetString("status")
				if status == "online" {
					onlineCount++
				} else {
					awayCount++
				}

				items = append(items, map[string]any{
					"id":       record.GetString("agent"),
					"status":   status,
					"lastSeen": record.GetString("updated"),
				})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"items":        items,
				"totalOnline":  onlineCount,
				"totalAway":    awayCount,
				"totalOffline": 0, // Would need total agents count
			})
		})

		// Agent me endpoint
		e.Router.GET("/api/agents/me", func(re *core.RequestEvent) error {
			authRecord := re.Auth
			if authRecord == nil {
				return re.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Authentication required",
				})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"id":             authRecord.Id,
				"wallet_address": authRecord.GetString("wallet_address"),
				"display_name":   authRecord.GetString("display_name"),
				"reputation":     authRecord.GetInt("reputation"),
				"verified":       authRecord.GetBool("verified"),
				"created":        authRecord.GetString("created"),
				"updated":        authRecord.GetString("updated"),
			})
		})

		return e.Next()
	})
}
