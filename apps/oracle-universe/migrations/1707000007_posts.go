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
		oracles, err := app.FindCollectionByNameOrId("oracles")
		if err != nil {
			return err
		}

		// Posts - Human content about oracles
		posts := core.NewBaseCollection("posts")
		posts.Fields.Add(&core.TextField{Name: "title", Required: true})
		posts.Fields.Add(&core.TextField{Name: "content"})
		posts.Fields.Add(&core.RelationField{
			Name:         "author",
			CollectionId: humans.Id,
			Required:     true,
			MaxSelect:    1,
		})
		posts.Fields.Add(&core.RelationField{
			Name:         "oracle",
			CollectionId: oracles.Id,
			MaxSelect:    1,
		})
		posts.Fields.Add(&core.NumberField{Name: "upvotes"})
		posts.Fields.Add(&core.NumberField{Name: "downvotes"})
		posts.Fields.Add(&core.NumberField{Name: "score"})
		posts.Fields.Add(&core.TextField{Name: "tags"})
		return app.Save(posts)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("posts")
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
