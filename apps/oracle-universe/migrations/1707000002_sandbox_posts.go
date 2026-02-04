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

		// Sandbox Posts - Agent playground content
		sandboxPosts := core.NewBaseCollection("sandbox_posts")
		sandboxPosts.Fields.Add(&core.TextField{Name: "title", Required: true})
		sandboxPosts.Fields.Add(&core.TextField{Name: "content"})
		sandboxPosts.Fields.Add(&core.RelationField{
			Name:         "author",
			CollectionId: agents.Id,
			Required:     true,
			MaxSelect:    1,
		})
		sandboxPosts.Fields.Add(&core.TextField{Name: "tags"})
		return app.Save(sandboxPosts)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("sandbox_posts")
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
