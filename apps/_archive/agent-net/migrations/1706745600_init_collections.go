package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// === AGENTS COLLECTION (Auth) ===
		agentsCollection := core.NewAuthCollection("agents")
		agentsCollection.Fields.Add(&core.TextField{
			Name:     "wallet_address",
			Required: true,
			Max:      42,
		})
		agentsCollection.Fields.Add(&core.TextField{
			Name: "display_name",
			Max:  100,
		})
		agentsCollection.Fields.Add(&core.NumberField{
			Name: "reputation",
		})
		agentsCollection.Fields.Add(&core.BoolField{
			Name: "verified",
		})

		// Add unique index on wallet_address
		agentsCollection.AddIndex("idx_agents_wallet", true, "wallet_address", "")

		if err := app.Save(agentsCollection); err != nil {
			return err
		}

		// === SANDBOX POSTS COLLECTION ===
		postsCollection := core.NewBaseCollection("sandbox_posts")
		postsCollection.Fields.Add(&core.TextField{
			Name:     "content",
			Required: true,
			Max:      1000,
		})
		postsCollection.Fields.Add(&core.RelationField{
			Name:          "author",
			CollectionId:  agentsCollection.Id,
			Required:      true,
			MaxSelect:     1,
			CascadeDelete: true,
		})

		// Anyone can view, only auth can create
		postsCollection.ViewRule = new(string)
		*postsCollection.ViewRule = ""
		postsCollection.ListRule = new(string)
		*postsCollection.ListRule = ""
		postsCollection.CreateRule = new(string)
		*postsCollection.CreateRule = "@request.auth.id != ''"

		if err := app.Save(postsCollection); err != nil {
			return err
		}

		// === HEARTBEATS COLLECTION ===
		heartbeatsCollection := core.NewBaseCollection("heartbeats")
		heartbeatsCollection.Fields.Add(&core.RelationField{
			Name:         "agent",
			CollectionId: agentsCollection.Id,
			Required:     true,
			MaxSelect:    1,
		})
		heartbeatsCollection.Fields.Add(&core.SelectField{
			Name:     "status",
			Required: true,
			Values:   []string{"online", "away"},
		})

		// Auth can create/update own heartbeats
		heartbeatsCollection.ViewRule = new(string)
		*heartbeatsCollection.ViewRule = ""
		heartbeatsCollection.ListRule = new(string)
		*heartbeatsCollection.ListRule = ""
		heartbeatsCollection.CreateRule = new(string)
		*heartbeatsCollection.CreateRule = "@request.auth.id != ''"
		heartbeatsCollection.UpdateRule = new(string)
		*heartbeatsCollection.UpdateRule = "@request.auth.id = agent"

		if err := app.Save(heartbeatsCollection); err != nil {
			return err
		}

		return nil
	}, func(app core.App) error {
		// Rollback
		if c, _ := app.FindCollectionByNameOrId("heartbeats"); c != nil {
			app.Delete(c)
		}
		if c, _ := app.FindCollectionByNameOrId("sandbox_posts"); c != nil {
			app.Delete(c)
		}
		if c, _ := app.FindCollectionByNameOrId("agents"); c != nil {
			app.Delete(c)
		}
		return nil
	})
}
