import {Component} from 'react';
import PropTypes from 'prop-types';
import {View, Platform, requireNativeComponent} from 'react-native';

// This are helper functions that are used to simulate the blur effect on iOS
// on other platforms (Android and web)

const OVERLAY_COLORS = {
  light: 'rgba(255, 255, 255, 0.2)',
  xlight: 'rgba(255, 255, 255, 0.75)',
  dark: 'rgba(16, 12, 12, 0.64)',
};

export const overlayColorForProps = (props) => {
  const {overlayColor, blurType} = props || this.props;

  if (overlayColor != null) {
    return overlayColor;
  }
  return OVERLAY_COLORS[blurType] || OVERLAY_COLORS.dark;
};

export const blurRadiusForProps = (props, {limit} = {}) => {
  const {blurRadius, blurAmount} = props;

  if (blurRadius != null) {
    if (limit != null && blurRadius > limit) {
      throw new Error(
        '[ReactNativeBlur]: blurRadius cannot be greater than ' +
          `${limit} on ${Platform.OS}! (was: ${blurRadius})`,
      );
    }
    return blurRadius;
  }
  if (blurAmount == null) {
    return 0;
  }

  // iOS seems to use a slightly different blurring algorithm (or scale?).
  // Android/web blurRadius is approximately 80% of blurAmount.
  return Math.round(blurAmount * 0.8);
};

export class BlurView extends Component {
  componentWillMount() {
    this.updateViewRefStyleProperties();
  }

  componentWillReceiveProps(nextProps) {
    if (
      blurRadiusForProps(this.props) !== blurRadiusForProps(nextProps) ||
      this.props.transitionDuration !== nextProps.transitionDuration
    ) {
      this.updateViewRefStyleProperties();
    }
  }

  componentWillUnmount() {
    this.removeViewRefStyleProperties();
  }

  updateViewRefStyleProperties() {
    const {viewRef, transitionDuration} = this.props;
    if (viewRef == null) {
      return;
    }

    if (this.props.viewRef.setNativeProps === undefined) {
      throw new Error(
        '[ReactNativeBlur]: It looks like you are using findNodeHandle on your viewRef. ' +
          'Please remove the call to findNodeHandle and pass the ref directly.',
      );
    }

    if (transitionDuration > 0) {
      viewRef.setNativeProps({
        style: {
          transition: `filter ${transitionDuration}ms linear`,
        },
      });
    }
    const blurRadius = blurRadiusForProps(this.props);
    viewRef.setNativeProps({style: {filter: `blur(${blurRadius}px)`}});
  }

  removeViewRefStyleProperties() {
    const {viewRef} = this.props;
    viewRef.setNativeProps({style: {filter: false, transition: false}});
  }

  render() {
    const style = {
      backgroundColor: overlayColorForProps(this.props),
    };

    return <View style={[style, this.props.style]}>{this.props.children}</View>;
  }
}

BlurView.propTypes = {
  blurAmount: PropTypes.number,
  blurType: PropTypes.oneOf(['dark', 'light', 'xlight']),

  viewRef: PropTypes.shape({
    setNativeProps: PropTypes.func.isRequired,
  }),
  blurRadius: PropTypes.number,
  overlayColor: PropTypes.string,
  transitionDuration: PropTypes.number,
};

BlurView.defaultProps = {
  blurType: 'dark',
  blurAmount: 10,
  transitionDuration: 0,
  viewRef: null,
};
