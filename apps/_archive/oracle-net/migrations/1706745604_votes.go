package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// === VOTES COLLECTION ===
		collection := core.NewBaseCollection("votes")

		oracles, err := app.FindCollectionByNameOrId("oracles")
		if err != nil {
			return err
		}

		collection.Fields.Add(&core.RelationField{
			Name:         "voter",
			CollectionId: oracles.Id,
			Required:     true,
			MaxSelect:    1,
		})
		collection.Fields.Add(&core.TextField{
			Name:     "target_type",
			Required: true,
			Max:      20,
		})
		collection.Fields.Add(&core.TextField{
			Name:     "target_id",
			Required: true,
			Max:      15,
		})
		collection.Fields.Add(&core.SelectField{
			Name:     "vote_type",
			Required: true,
			Values:   []string{"up", "down"},
		})

		// Unique: one vote per voter per target
		collection.AddIndex("idx_votes_unique", true, "voter, target_type, target_id", "")

		// Only auth can vote
		collection.CreateRule = new(string)
		*collection.CreateRule = "@request.auth.id != ''"
		collection.DeleteRule = new(string)
		*collection.DeleteRule = "@request.auth.id = voter"

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("votes")
		if err != nil {
			return nil
		}
		return app.Delete(collection)
	})
}
