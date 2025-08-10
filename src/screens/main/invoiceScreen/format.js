import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const format = () => {
    return (
        <View>
            <Text style={[styles.cellDynamic, styles.srNoWidth]}>{index + 1}</Text>
            <Text style={[styles.cellDynamic, styles.descriptionWidth, styles.leftAlign]}>
                {item.description}
            </Text>
            <Text style={styles.cellDynamic}>{item.qty}</Text>
            <Text style={styles.cellDynamic}>{item.hsn}</Text>
            <Text style={styles.cellDynamic}>$    {item.per_unit_dollar}</Text>
            <Text style={styles.cellDynamic}>$    {item.total_amt_dollar}</Text>
            <Text style={styles.cellDynamic}>{item.per_unit_rupees}</Text>
            <Text style={styles.cellDynamic}>{item.taxable_amt}</Text>
            <Text style={styles.cellDynamic}>{item.gst}</Text>
            <Text style={styles.cellDynamic}>{item.gst_amt}</Text>
            <Text style={styles.cellDynamic}>{item.total_net_wt}</Text>
            <Text style={styles.cellDynamic}>BAJAJ</Text>
        </View>
    )
}

export default format

const styles = StyleSheet.create({})
