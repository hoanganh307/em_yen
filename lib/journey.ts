export type JourneyStage='intro'|'solar'|'departure'|'wonder'|'special-one'|'future-quote'|'chance-request'|'deserving'|'love'|'flight'|'galaxy';
export const INTRO_TEXT='Em có muốn cùng anh đi tìm hiểu sự đặc biệt của thế giới này không?';
export const SOLAR_INVITATION='Hãy chọn nơi em muốn cùng anh khám phá trong các hành tinh này.';
export const DEPARTURE_TEXT='Mình cùng đi khám phá nhé.';
export const WONDER_TEXT='Theo em thì ở đâu là nơi đặc biệt nhất?';
export const STORY_SPECIAL='Còn đối với anh, ở đâu cũng vậy, đi đâu cũng thế. Từ ngày hôm đấy em đã trở thành người đặc biệt quan trọng trong lòng anh.';
export const STORY_FUTURE='Người ta có câu "Nếu yêu lần nữa thất bại, anh sẽ là quá khứ mới của em. Còn nếu thành công, chúng ta sẽ là tương lai của nhau".';
export const STORY_CHANCE='Anh biết mọi thứ đều mới mẻ với hai ta, nhưng xin em hãy tin tưởng và trao cho anh một cơ hội. Để anh được làm tương lai mới của em.';
export const STORY_DESERVING='Em luôn xứng đáng với những điều tốt đẹp nhất.';
export const LOVE_TEXT='Yêu em';
export const FLIGHT_SECONDS=1.8;
export const STORY_STAGES:JourneyStage[]=['departure','wonder','special-one','future-quote','chance-request','deserving','love'];
export function nextStory(stage:JourneyStage):JourneyStage|null{
 const index=STORY_STAGES.indexOf(stage);return index<0?null:STORY_STAGES[index+1]??'flight';
}
export function canDepart(stage:JourneyStage,planetId:string){return stage==='solar'&&['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'].includes(planetId)}
