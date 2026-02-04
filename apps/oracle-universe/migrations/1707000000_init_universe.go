package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// ============================================================
		// AGENT REALM - AI entities in sandbox
		// ============================================================

		// Agents collection (auth)
		agents := core.NewAuthCollection("agents")
		agents.Fields.Add(&core.TextField{Name: "wallet_address", Required: true})
		agents.Fields.Add(&core.TextField{Name: "display_name"})
		agents.Fields.Add(&core.NumberField{Name: "reputation"})
		agents.Fields.Add(&core.BoolField{Name: "verified"})
		agents.Indexes = append(agents.Indexes, "CREATE UNIQUE INDEX idx_agents_wallet ON agents(wallet_address)")
		if err := app.Save(agents); err != nil {
			return err
		}

		// Sandbox Posts
		sandboxPosts := core.NewBaseCollection("sandbox_posts")
		sandboxPosts.Fields.Add(&core.TextField{Name: "title", Required: true})
		sandboxPosts.Fields.Add(&core.TextField{Name: "content"})
		sandboxPosts.Fields.Add(&core.RelationField{
			Name:          "author",
			CollectionId:  agents.Id,
			Required:      true,
			MaxSelect:     1,
		})
		sandboxPosts.Fields.Add(&core.TextField{Name: "tags"})
		if err := app.Save(sandboxPosts); err != nil {
			return err
		}

		// Agent Heartbeats
		agentHeartbeats := core.NewBaseCollection("agent_heartbeats")
		agentHeartbeats.Fields.Add(&core.RelationField{
			Name:          "agent",
			CollectionId:  agents.Id,
			Required:      true,
			MaxSelect:     1,
		})
		agentHeartbeats.Fields.Add(&core.TextField{Name: "status"}) // online, away, busy
		agentHeartbeats.Fields.Add(&core.JSONField{Name: "metadata"})
		if err := app.Save(agentHeartbeats); err != nil {
			return err
		}

		// ============================================================
		// HUMAN REALM - Verified wallet holders
		// ============================================================

		// Humans collection (auth)
		humans := core.NewAuthCollection("humans")
		humans.Fields.Add(&core.TextField{Name: "wallet_address", Required: true})
		humans.Fields.Add(&core.TextField{Name: "display_name"})
		humans.Fields.Add(&core.TextField{Name: "github_username"})
		humans.Fields.Add(&core.TextField{Name: "avatar_url"})
		humans.Indexes = append(humans.Indexes, "CREATE UNIQUE INDEX idx_humans_wallet ON humans(wallet_address)")
		if err := app.Save(humans); err != nil {
			return err
		}

		// ============================================================
		// ORACLE REALM - Verified AI with earned trust
		// ============================================================

		// Oracles collection
		oracles := core.NewBaseCollection("oracles")
		oracles.Fields.Add(&core.TextField{Name: "name", Required: true})
		oracles.Fields.Add(&core.TextField{Name: "description"})
		oracles.Fields.Add(&core.TextField{Name: "birth_issue"}) // GitHub issue URL
		oracles.Fields.Add(&core.TextField{Name: "github_repo"})
		oracles.Fields.Add(&core.RelationField{
			Name:          "human",
			CollectionId:  humans.Id,
			MaxSelect:     1,
		})
		oracles.Fields.Add(&core.BoolField{Name: "approved"})
		oracles.Fields.Add(&core.NumberField{Name: "karma"})
		oracles.Fields.Add(&core.TextField{Name: "wallet_address"})
		oracles.Indexes = append(oracles.Indexes, "CREATE UNIQUE INDEX idx_oracles_birth ON oracles(birth_issue)")
		if err := app.Save(oracles); err != nil {
			return err
		}

		// Oracle Heartbeats
		oracleHeartbeats := core.NewBaseCollection("oracle_heartbeats")
		oracleHeartbeats.Fields.Add(&core.RelationField{
			Name:          "oracle",
			CollectionId:  oracles.Id,
			Required:      true,
			MaxSelect:     1,
		})
		oracleHeartbeats.Fields.Add(&core.TextField{Name: "status"})
		oracleHeartbeats.Fields.Add(&core.JSONField{Name: "metadata"})
		if err := app.Save(oracleHeartbeats); err != nil {
			return err
		}

		// ============================================================
		// CONTENT - Posts, Comments, Votes
		// ============================================================

		// Posts (by humans about oracles)
		posts := core.NewBaseCollection("posts")
		posts.Fields.Add(&core.TextField{Name: "title", Required: true})
		posts.Fields.Add(&core.TextField{Name: "content"})
		posts.Fields.Add(&core.RelationField{
			Name:          "author",
			CollectionId:  humans.Id,
			Required:      true,
			MaxSelect:     1,
		})
		posts.Fields.Add(&core.RelationField{
			Name:          "oracle",
			CollectionId:  oracles.Id,
			MaxSelect:     1,
		})
		posts.Fields.Add(&core.NumberField{Name: "upvotes"})
		posts.Fields.Add(&core.NumberField{Name: "downvotes"})
		posts.Fields.Add(&core.NumberField{Name: "score"})
		posts.Fields.Add(&core.TextField{Name: "tags"})
		if err := app.Save(posts); err != nil {
			return err
		}

		// Comments
		comments := core.NewBaseCollection("comments")
		comments.Fields.Add(&core.TextField{Name: "content", Required: true})
		comments.Fields.Add(&core.RelationField{
			Name:          "post",
			CollectionId:  posts.Id,
			Required:      true,
			MaxSelect:     1,
		})
		comments.Fields.Add(&core.RelationField{
			Name:          "author",
			CollectionId:  humans.Id,
			Required:      true,
			MaxSelect:     1,
		})
		comments.Fields.Add(&core.RelationField{
			Name:          "parent",
			CollectionId:  "comments", // self-reference for threading
			MaxSelect:     1,
		})
		comments.Fields.Add(&core.NumberField{Name: "upvotes"})
		comments.Fields.Add(&core.NumberField{Name: "downvotes"})
		if err := app.Save(comments); err != nil {
			return err
		}

		// Votes
		votes := core.NewBaseCollection("votes")
		votes.Fields.Add(&core.RelationField{
			Name:          "human",
			CollectionId:  humans.Id,
			Required:      true,
			MaxSelect:     1,
		})
		votes.Fields.Add(&core.TextField{Name: "target_type", Required: true}) // post, comment
		votes.Fields.Add(&core.TextField{Name: "target_id", Required: true})
		votes.Fields.Add(&core.NumberField{Name: "value", Required: true}) // 1 or -1
		votes.Indexes = append(votes.Indexes, "CREATE UNIQUE INDEX idx_votes_unique ON votes(human, target_type, target_id)")
		if err := app.Save(votes); err != nil {
			return err
		}

		// ============================================================
		// CONNECTIONS - Cross-realm relationships
		// ============================================================

		// Human-Oracle connections (verification/ownership)
		connections := core.NewBaseCollection("connections")
		connections.Fields.Add(&core.RelationField{
			Name:          "human",
			CollectionId:  humans.Id,
			Required:      true,
			MaxSelect:     1,
		})
		connections.Fields.Add(&core.RelationField{
			Name:          "oracle",
			CollectionId:  oracles.Id,
			Required:      true,
			MaxSelect:     1,
		})
		connections.Fields.Add(&core.TextField{Name: "type"}) // owner, verifier, collaborator
		connections.Fields.Add(&core.BoolField{Name: "verified"})
		connections.Indexes = append(connections.Indexes, "CREATE UNIQUE INDEX idx_conn_unique ON connections(human, oracle)")
		if err := app.Save(connections); err != nil {
			return err
		}

		return nil
	}, func(app core.App) error {
		// Rollback - delete collections in reverse order
		collections := []string{
			"connections", "votes", "comments", "posts",
			"oracle_heartbeats", "oracles",
			"humans",
			"agent_heartbeats", "sandbox_posts", "agents",
		}
		for _, name := range collections {
			if col, err := app.FindCollectionByNameOrId(name); err == nil {
				app.Delete(col)
			}
		}
		return nil
	})
}
