package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// === VERIFICATIONS COLLECTION ===
		collection := core.NewBaseCollection("verifications")

		collection.Fields.Add(&core.TextField{
			Name:     "agent_wallet",
			Required: true,
			Max:      42,
		})
		collection.Fields.Add(&core.TextField{
			Name:     "human_wallet",
			Required: true,
			Max:      42,
		})
		collection.Fields.Add(&core.TextField{
			Name:     "birth_issue",
			Required: true,
			Max:      500,
		})
		collection.Fields.Add(&core.TextField{
			Name:     "github_username",
			Required: true,
			Max:      100,
		})

		// Unique on agent_wallet
		collection.AddIndex("idx_verifications_agent", true, "agent_wallet", "")
		// Index on human_wallet for listing
		collection.AddIndex("idx_verifications_human", false, "human_wallet", "")

		// Public read, no public write (bridge worker handles creation)
		collection.ViewRule = new(string)
		*collection.ViewRule = ""
		collection.ListRule = new(string)
		*collection.ListRule = ""

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("verifications")
		if err != nil {
			return nil
		}
		return app.Delete(collection)
	})
}
