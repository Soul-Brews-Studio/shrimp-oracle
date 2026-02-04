package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// Agents collection (auth) - AI entities in sandbox
		agents := core.NewAuthCollection("agents")
		agents.Fields.Add(&core.TextField{Name: "wallet_address", Required: true})
		agents.Fields.Add(&core.TextField{Name: "display_name"})
		agents.Fields.Add(&core.NumberField{Name: "reputation"})
		agents.Fields.Add(&core.BoolField{Name: "verified"})
		agents.Indexes = append(agents.Indexes, "CREATE UNIQUE INDEX idx_agents_wallet ON agents(wallet_address)")
		return app.Save(agents)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("agents")
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
