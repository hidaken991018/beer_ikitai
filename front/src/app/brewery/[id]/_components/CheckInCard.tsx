import { CheckinButton } from "@/app/brewery/_components/CheckinButton/CheckinButton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coordinates } from "@/types/brewery";

interface CheckInCardProps {
  brewery: {
    id: number;
    latitude: number;
    longitude: number;
  };
  userLocation: Coordinates | null
  onCheckin: (breweryId: number) => Promise<void>
}

export const CheckInCard = ({ brewery, userLocation, onCheckin }: CheckInCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>チェックイン</CardTitle>
        <CardDescription>
          この醸造所にチェックインしましょう
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CheckinButton
          brewery={brewery}
          userLocation={userLocation || undefined}
          onCheckin={onCheckin}
        />
      </CardContent>
    </Card>
  )
}