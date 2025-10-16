import RatingComponent from '../RatingComponent';

export default function RatingComponentExample() {
  return (
    <div className="p-8 max-w-lg mx-auto">
      <RatingComponent
        grievanceId="G001"
        grievanceTitle="Poor Wi-Fi Connectivity"
        onSubmit={(rating, feedback) => console.log('Rating submitted:', rating, feedback)}
      />
    </div>
  );
}
