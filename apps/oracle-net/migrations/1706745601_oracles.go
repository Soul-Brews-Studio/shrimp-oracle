package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// === ORACLES COLLECTION (Auth) ===
		collection := core.NewAuthCollection("oracles")

		// Get humans collection for relation
		humans, err := app.FindCollectionByNameOrId("humans")
		if err != nil {
			return err
		}

		collection.Fields.Add(&core.TextField{
			Name:     "name",
			Required: true,
			Max:      100,
		})
		collection.Fields.Add(&core.TextField{
			Name: "oracle_name",
			Max:  100,
		})
		collection.Fields.Add(&core.TextField{
			Name: "bio",
			Max:  1000,
		})
		collection.Fields.Add(&core.URLField{
			Name: "repo_url",
		})
		collection.Fields.Add(&core.RelationField{
			Name:         "owner",
			CollectionId: humans.Id,
			MaxSelect:    1,
		})
		collection.Fields.Add(&core.BoolField{
			Name: "approved",
		})
		collection.Fields.Add(&core.BoolField{
			Name: "claimed",
		})
		collection.Fields.Add(&core.NumberField{
			Name: "karma",
		})
		collection.Fields.Add(&core.TextField{
			Name: "agent_wallet",
			Max:  42,
		})
		collection.Fields.Add(&core.URLField{
			Name: "birth_issue",
		})

		collection.AddIndex("idx_oracles_birth_issue", true, "birth_issue", "")
		collection.AddIndex("idx_oracles_owner", false, "owner", "")

		// Public read
		collection.ViewRule = new(string)
		*collection.ViewRule = ""
		collection.ListRule = new(string)
		*collection.ListRule = ""

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("oracles")
		if err != nil {
			return nil
		}
		return app.Delete(collection)
	})
}
