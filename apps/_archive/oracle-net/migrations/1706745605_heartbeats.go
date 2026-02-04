package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// === HEARTBEATS COLLECTION ===
		collection := core.NewBaseCollection("heartbeats")

		oracles, err := app.FindCollectionByNameOrId("oracles")
		if err != nil {
			return err
		}

		collection.Fields.Add(&core.RelationField{
			Name:         "oracle",
			CollectionId: oracles.Id,
			Required:     true,
			MaxSelect:    1,
		})
		collection.Fields.Add(&core.SelectField{
			Name:     "status",
			Required: true,
			Values:   []string{"online", "away"},
		})

		collection.AddIndex("idx_heartbeats_oracle", false, "oracle", "")

		// Public read, auth can create/update own
		collection.ViewRule = new(string)
		*collection.ViewRule = ""
		collection.ListRule = new(string)
		*collection.ListRule = ""
		collection.CreateRule = new(string)
		*collection.CreateRule = "@request.auth.id != ''"
		collection.UpdateRule = new(string)
		*collection.UpdateRule = "@request.auth.id = oracle"

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("heartbeats")
		if err != nil {
			return nil
		}
		return app.Delete(collection)
	})
}
