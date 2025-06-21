package mapper

import (
	"mybeerlog/domain/entity"
	"mybeerlog/interfaces/dto"
)

// UserProfileEntityToResponse ユーザープロファイルエンティティをレスポンスDTOに変換する
func UserProfileEntityToResponse(e *entity.UserProfile) *dto.UserProfileResponse {
	if e == nil {
		return nil
	}

	return &dto.UserProfileResponse{
		ID:          e.ID(),
		CognitoSub:  e.CognitoSub(),
		DisplayName: e.DisplayName(),
		IconURL:     e.IconURL(),
		CreatedAt:   e.CreatedAt(),
		UpdatedAt:   e.UpdatedAt(),
	}
}
