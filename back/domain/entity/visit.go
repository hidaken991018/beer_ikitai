package entity

import (
	"errors"
	"time"
)

// Visit はドメイン内のユーザーの醇造所訪問を表す
type Visit struct {
	id            int
	userProfileID int
	userProfile   *UserProfile
	breweryID     int
	brewery       *Brewery
	visitedAt     time.Time
}

// VisitBuilder はVisitインスタンスの作成を支援する
type VisitBuilder struct {
	visit *Visit
}

// NewVisitBuilder 新しいVisitBuilderを作成する
func NewVisitBuilder() *VisitBuilder {
	return &VisitBuilder{
		visit: &Visit{
			visitedAt: time.Now(),
		},
	}
}

// WithID IDを設定する
func (b *VisitBuilder) WithID(id int) *VisitBuilder {
	b.visit.id = id
	return b
}

// WithUserProfileID ユーザープロファイルIDを設定する
func (b *VisitBuilder) WithUserProfileID(userProfileID int) *VisitBuilder {
	b.visit.userProfileID = userProfileID
	return b
}

// WithUserProfile ユーザープロファイルを設定する
func (b *VisitBuilder) WithUserProfile(userProfile *UserProfile) *VisitBuilder {
	b.visit.userProfile = userProfile
	if userProfile != nil {
		b.visit.userProfileID = userProfile.ID()
	}
	return b
}

// WithBreweryID 醇造所IDを設定する
func (b *VisitBuilder) WithBreweryID(breweryID int) *VisitBuilder {
	b.visit.breweryID = breweryID
	return b
}

// WithBrewery 醇造所を設定する
func (b *VisitBuilder) WithBrewery(brewery *Brewery) *VisitBuilder {
	b.visit.brewery = brewery
	if brewery != nil {
		b.visit.breweryID = brewery.ID()
	}
	return b
}

// WithVisitedAt 訪問日時を設定する
func (b *VisitBuilder) WithVisitedAt(visitedAt time.Time) *VisitBuilder {
	b.visit.visitedAt = visitedAt
	return b
}

// Build Visitインスタンスを作成する
func (b *VisitBuilder) Build() (*Visit, error) {
	if err := b.visit.validate(); err != nil {
		return nil, err
	}
	return b.visit, nil
}

// NewVisit 新しいVisitインスタンスを作成する（一般的なユースケースのショートハンド）
func NewVisit(userProfileID, breweryID int) (*Visit, error) {
	return NewVisitBuilder().
		WithUserProfileID(userProfileID).
		WithBreweryID(breweryID).
		Build()
}

// ID IDを取得する
func (v *Visit) ID() int {
	return v.id
}

// UserProfileID ユーザープロファイルIDを取得する
func (v *Visit) UserProfileID() int {
	return v.userProfileID
}

// UserProfile ユーザープロファイルを取得する
func (v *Visit) UserProfile() *UserProfile {
	return v.userProfile
}

// BreweryID 醇造所IDを取得する
func (v *Visit) BreweryID() int {
	return v.breweryID
}

// Brewery 醇造所を取得する
func (v *Visit) Brewery() *Brewery {
	return v.brewery
}

// VisitedAt 訪問日時を取得する
func (v *Visit) VisitedAt() time.Time {
	return v.visitedAt
}

// IsValid 訪問が有効かどうかを判定する
func (v *Visit) IsValid() bool {
	return v.validate() == nil
}

// validate 訪問のバリデーションを実行する
func (v *Visit) validate() error {
	if v.userProfileID <= 0 {
		return errors.New("user profile ID must be positive")
	}
	if v.breweryID <= 0 {
		return errors.New("brewery ID must be positive")
	}
	if v.visitedAt.IsZero() {
		return errors.New("visited at timestamp is required")
	}
	if v.visitedAt.After(time.Now()) {
		return errors.New("visited at timestamp cannot be in the future")
	}
	return nil
}

// IsSameUser 訪問が指定されたユーザーに属するかどうかを確認する
func (v *Visit) IsSameUser(userProfileID int) bool {
	return v.userProfileID == userProfileID
}

