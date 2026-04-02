#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BackgroundSpeechIOS, NSObject)
RCT_EXTERN_METHOD(speak:(NSString *)text)
@end
