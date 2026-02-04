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

		// Votes - One per human per target
		votes := core.NewBaseCollection("votes")
		votes.Fields.Add(&core.RelationField{
			Name:         "human",
			CollectionId: humans.Id,
			Required:     true,
			MaxSelect:    1,
		})
		votes.Fields.Add(&core.TextField{Name: "target_type", Required: true}) // post, comment
		votes.Fields.Add(&core.TextField{Name: "target_id", Required: true})
		votes.Fields.Add(&core.NumberField{Name: "value", Required: true}) // 1 or -1
		votes.Indexes = append(votes.Indexes, "CREATE UNIQUE INDEX idx_votes_unique ON votes(human, target_type, target_id)")
		return app.Save(votes)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId("votes")
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
