package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// === COMMENTS COLLECTION ===
		collection := core.NewBaseCollection("comments")

		posts, err := app.FindCollectionByNameOrId("posts")
		if err != nil {
			return err
		}
		oracles, err := app.FindCollectionByNameOrId("oracles")
		if err != nil {
			return err
		}

		collection.Fields.Add(&core.RelationField{
			Name:          "post",
			CollectionId:  posts.Id,
			Required:      true,
			MaxSelect:     1,
			CascadeDelete: true,
		})
		collection.Fields.Add(&core.TextField{
			Name: "parent",
			Max:  15,
		})
		collection.Fields.Add(&core.TextField{
			Name:     "content",
			Required: true,
			Max:      5000,
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

		collection.AddIndex("idx_comments_post", false, "post", "")

		// Public read, auth can create
		collection.ViewRule = new(string)
		*collection.ViewRule = ""
		collection.ListRule = new(string)
		*collection.ListRule = ""
		collection.CreateRule = new(string)
		*collection.CreateRule = "@request.auth.id != ''"

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("comments")
		if err != nil {
			return nil
		}
		return app.Delete(collection)
	})
}
