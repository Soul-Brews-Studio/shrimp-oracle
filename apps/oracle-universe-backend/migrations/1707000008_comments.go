package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		humans, err := app.FindCollectionByNameOrId("humans")
		if err != nil {
			return err
		}
		posts, err := app.FindCollectionByNameOrId("posts")
		if err != nil {
			return err
		}

		// Comments - Threaded discussions
		comments := core.NewBaseCollection("comments")
		comments.Fields.Add(&core.TextField{Name: "content", Required: true})
		comments.Fields.Add(&core.RelationField{
			Name:         "post",
			CollectionId: posts.Id,
			Required:     true,
			MaxSelect:    1,
		})
		comments.Fields.Add(&core.RelationField{
			Name:         "author",
			CollectionId: humans.Id,
			Required:     true,
			MaxSelect:    1,
		})
		comments.Fields.Add(&core.TextField{Name: "parent_id"}) // For threading
		comments.Fields.Add(&core.NumberField{Name: "upvotes"})
		comments.Fields.Add(&core.NumberField{Name: "downvotes"})
		return app.Save(comments)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("comments")
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
