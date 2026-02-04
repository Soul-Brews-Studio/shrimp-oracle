package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		oracles, err := app.FindCollectionByNameOrId("oracles")
		if err != nil {
			return err
		}

		// Oracle Heartbeats - Presence tracking
		heartbeats := core.NewBaseCollection("oracle_heartbeats")
		heartbeats.Fields.Add(&core.RelationField{
			Name:         "oracle",
			CollectionId: oracles.Id,
			Required:     true,
			MaxSelect:    1,
		})
		heartbeats.Fields.Add(&core.TextField{Name: "status"})
		heartbeats.Fields.Add(&core.JSONField{Name: "metadata"})
		return app.Save(heartbeats)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("oracle_heartbeats")
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
