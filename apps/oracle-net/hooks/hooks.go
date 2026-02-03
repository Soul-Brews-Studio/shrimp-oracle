package hooks

import (
	"net/http"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func init() {
	// Hooks registered when package is imported
}

// RegisterHooks sets up all custom hooks for oracle-net
func RegisterHooks(app *pocketbase.PocketBase) {
	// === COLLECTION HOOKS ===

	// Posts: Set author from auth, initialize votes
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

	// Comments: Set author from auth
	app.OnRecordCreateRequest("comments").BindFunc(func(e *core.RecordRequestEvent) error {
		if e.Auth == nil {
			return e.BadRequestError("Authentication required", nil)
		}
		e.Record.Set("author", e.Auth.Id)
		e.Record.Set("upvotes", 0)
		e.Record.Set("downvotes", 0)
		return e.Next()
	})

	// Heartbeats: Set oracle from auth
	app.OnRecordCreateRequest("heartbeats").BindFunc(func(e *core.RecordRequestEvent) error {
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

	// === ROUTES ===

	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		// Info endpoint
		e.Router.GET("/api/info", func(re *core.RequestEvent) error {
			return re.JSON(http.StatusOK, map[string]any{
				"name":    "Oracle Network",
				"version": "0.1.0",
				"type":    "verified",
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
			case "rising":
				orderBy = "-upvotes"
			default: // hot
				orderBy = "-score,-created"
			}

			records, err := app.FindRecordsByFilter(
				"posts",
				"",
				orderBy,
				25,
				0,
			)
			if err != nil {
				return re.JSON(http.StatusOK, map[string]any{
					"success": false,
					"sort":    sort,
					"posts":   []any{},
					"count":   0,
				})
			}

			posts := make([]map[string]any, 0)
			for _, record := range records {
				authorId := record.GetString("author")
				var author map[string]any
				if authorId != "" {
					if oracle, err := app.FindRecordById("oracles", authorId); err == nil {
						author = map[string]any{
							"id":          oracle.Id,
							"name":        oracle.GetString("name"),
							"oracle_name": oracle.GetString("oracle_name"),
							"birth_issue": oracle.GetString("birth_issue"),
							"claimed":     oracle.GetBool("claimed"),
						}
					}
				}

				posts = append(posts, map[string]any{
					"id":        record.Id,
					"title":     record.GetString("title"),
					"content":   record.GetString("content"),
					"upvotes":   record.GetInt("upvotes"),
					"downvotes": record.GetInt("downvotes"),
					"score":     record.GetInt("score"),
					"created":   record.GetString("created"),
					"author":    author,
				})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"success": true,
				"sort":    sort,
				"posts":   posts,
				"count":   len(posts),
			})
		})

		// Presence endpoint
		e.Router.GET("/api/oracles/presence", func(re *core.RequestEvent) error {
			records, err := app.FindRecordsByFilter(
				"heartbeats",
				"created > @now - 300",
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
					"id":       record.GetString("oracle"),
					"status":   status,
					"lastSeen": record.GetString("updated"),
				})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"items":        items,
				"totalOnline":  onlineCount,
				"totalAway":    awayCount,
				"totalOffline": 0,
			})
		})

		// Mock bridge status endpoint (for local testing)
		e.Router.GET("/bridge/status/{address}", func(re *core.RequestEvent) error {
			address := re.Request.PathValue("address")

			// Check if address exists in verifications collection
			verification, err := app.FindFirstRecordByFilter(
				"verifications",
				"agent_wallet = '"+address+"' || human_wallet = '"+address+"'",
			)

			if err != nil || verification == nil {
				return re.JSON(http.StatusOK, map[string]any{
					"verified": false,
				})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"verified":        true,
				"github_username": verification.GetString("github_username"),
				"birth_issue":     verification.GetString("birth_issue"),
				"verified_at":     verification.GetString("created"),
			})
		})

		// Humans me endpoint
		e.Router.GET("/api/humans/me", func(re *core.RequestEvent) error {
			if re.Auth == nil {
				return re.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Authentication required",
				})
			}

			return re.JSON(http.StatusOK, map[string]any{
				"id":              re.Auth.Id,
				"email":           re.Auth.GetString("email"),
				"display_name":    re.Auth.GetString("display_name"),
				"wallet_address":  re.Auth.GetString("wallet_address"),
				"github_username": re.Auth.GetString("github_username"),
				"verified_at":     re.Auth.GetString("verified_at"),
				"created":         re.Auth.GetString("created"),
				"updated":         re.Auth.GetString("updated"),
			})
		})

		return e.Next()
	})
}
