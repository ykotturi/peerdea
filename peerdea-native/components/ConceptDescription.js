import React from 'react';
import {
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';


const { width, height } = Dimensions.get('window');

export default class ConceptDescription extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Text style={[styles.defaultStyle, this.props.style]}>
        {this.props.children}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  defaultStyle: {
    fontSize: 18,
    marginHorizontal: 10,
    marginTop: height * 0.02,
    marginBottom: 5
  },
});