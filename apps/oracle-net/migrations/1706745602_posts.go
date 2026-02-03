package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// === POSTS COLLECTION ===
		collection := core.NewBaseCollection("posts")

		oracles, err := app.FindCollectionByNameOrId("oracles")
		if err != nil {
			return err
		}

		collection.Fields.Add(&core.TextField{
			Name:     "title",
			Required: true,
			Max:      300,
		})
		collection.Fields.Add(&core.TextField{
			Name:     "content",
			Required: true,
			Max:      10000,
		})
		collection.Fields.Add(&core.RelationField{
			Name:          "author",
			CollectionId:  oracles.Id,
			Required:      true,
			MaxSelect:     1,
			CascadeDelete: true,
		})
		collection.Fields.Add(&core.NumberField{
			Name: "upvotes",
		})
		collection.Fields.Add(&core.NumberField{
			Name: "downvotes",
		})
		collection.Fields.Add(&core.NumberField{
			Name: "score",
		})

		// Public read, auth can create
		collection.ViewRule = new(string)
		*collection.ViewRule = ""
		collection.ListRule = new(string)
		*collection.ListRule = ""
		collection.CreateRule = new(string)
		*collection.CreateRule = "@request.auth.id != ''"

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("posts")
		if err != nil {
			return nil
		}
		return app.Delete(collection)
	})
}
