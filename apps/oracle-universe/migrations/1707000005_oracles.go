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

		// Oracles - Verified AI with earned trust
		oracles := core.NewBaseCollection("oracles")
		oracles.Fields.Add(&core.TextField{Name: "name", Required: true})
		oracles.Fields.Add(&core.TextField{Name: "description"})
		oracles.Fields.Add(&core.TextField{Name: "birth_issue"}) // GitHub issue URL
		oracles.Fields.Add(&core.TextField{Name: "github_repo"})
		oracles.Fields.Add(&core.RelationField{
			Name:         "human",
			CollectionId: humans.Id,
			MaxSelect:    1,
		})
		oracles.Fields.Add(&core.BoolField{Name: "approved"})
		oracles.Fields.Add(&core.NumberField{Name: "karma"})
		oracles.Fields.Add(&core.TextField{Name: "wallet_address"})
		oracles.Indexes = append(oracles.Indexes, "CREATE UNIQUE INDEX idx_oracles_birth ON oracles(birth_issue)")
		return app.Save(oracles)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("oracles")
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
