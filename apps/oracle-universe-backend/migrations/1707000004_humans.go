package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// Humans collection (auth) - Verified wallet holders
		humans := core.NewAuthCollection("humans")
		humans.Fields.Add(&core.TextField{Name: "wallet_address", Required: true})
		humans.Fields.Add(&core.TextField{Name: "display_name"})
		humans.Fields.Add(&core.TextField{Name: "github_username"})
		humans.Fields.Add(&core.TextField{Name: "avatar_url"})
		humans.Indexes = append(humans.Indexes, "CREATE UNIQUE INDEX idx_humans_wallet ON humans(wallet_address)")
		return app.Save(humans)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("humans")
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
