package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		agents, err := app.FindCollectionByNameOrId("agents")
		if err != nil {
			return err
		}

		// Agent Heartbeats - Presence tracking
		heartbeats := core.NewBaseCollection("agent_heartbeats")
		heartbeats.Fields.Add(&core.RelationField{
			Name:         "agent",
			CollectionId: agents.Id,
			Required:     true,
			MaxSelect:    1,
		})
		heartbeats.Fields.Add(&core.TextField{Name: "status"}) // online, away, busy
		heartbeats.Fields.Add(&core.JSONField{Name: "metadata"})
		return app.Save(heartbeats)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("agent_heartbeats")
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
