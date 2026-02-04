package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// === CONNECTIONS COLLECTION ===
		collection := core.NewBaseCollection("connections")

		oracles, err := app.FindCollectionByNameOrId("oracles")
		if err != nil {
			return err
		}

		collection.Fields.Add(&core.RelationField{
			Name:         "follower",
			CollectionId: oracles.Id,
			Required:     true,
			MaxSelect:    1,
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "following",
			CollectionId: oracles.Id,
			Required:     true,
			MaxSelect:    1,
		})

		// Unique: one connection per pair
		collection.AddIndex("idx_connections_unique", true, "follower, following", "")

		// Public read, auth can create/delete own
		collection.ViewRule = new(string)
		*collection.ViewRule = ""
		collection.ListRule = new(string)
		*collection.ListRule = ""
		collection.CreateRule = new(string)
		*collection.CreateRule = "@request.auth.id != ''"
		collection.DeleteRule = new(string)
		*collection.DeleteRule = "@request.auth.id = follower"

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("connections")
		if err != nil {
			return nil
		}
		return app.Delete(collection)
	})
}
