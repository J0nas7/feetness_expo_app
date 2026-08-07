#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WatchBridge, RCTEventEmitter)

RCT_EXTERN_METHOD(publishWorkout:(NSDictionary *)snapshot)

@end
