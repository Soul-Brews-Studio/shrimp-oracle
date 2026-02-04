package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// === HUMANS COLLECTION (Auth) ===
		collection := core.NewAuthCollection("humans")
		collection.Fields.Add(&core.TextField{
			Name:     "wallet_address",
			Required: true,
			Max:      42,
		})
		collection.Fields.Add(&core.TextField{
			Name: "display_name",
			Max:  100,
		})
		collection.Fields.Add(&core.TextField{
			Name: "github_username",
			Max:  100,
		})
		collection.Fields.Add(&core.TextField{
			Name: "verified_at",
			Max:  30,
		})

		collection.AddIndex("idx_humans_wallet", true, "wallet_address", "")
		collection.AddIndex("idx_humans_github", false, "github_username", "")

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("humans")
		if err != nil {
			return nil
		}
		return app.Delete(collection)
	})
}
